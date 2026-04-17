#!/usr/bin/env node

const DEFAULT_API_BASE = "https://smartai-production-7661.up.railway.app/api";
const apiBase = (process.env.SMARTAI_API_BASE || DEFAULT_API_BASE).replace(/\/$/, "");
const origin = new URL(apiBase).origin;

const runId = Date.now();
const username = `student_${runId}`;
const email = `${username}@example.com`;
const password = "TestPassword123!";

const results = [];

const printHeader = () => {
  console.log("========================================");
  console.log("SMARTAI RELIABLE SMOKE TEST");
  console.log("========================================");
  console.log(`API Base: ${apiBase}`);
  console.log(`Test User: ${email}`);
  console.log("");
};

const pushResult = (name, status, detail) => {
  results.push({ name, status, detail });
  const label = status === "PASS" ? "PASS" : status === "WARN" ? "WARN" : "FAIL";
  console.log(`[${label}] ${name} - ${detail}`);
};

const parseResponseBody = async (res) => {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const request = async (path, { method = "GET", token, body } = {}) => {
  const headers = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await parseResponseBody(res);
  return { status: res.status, data };
};

const healthCheck = async () => {
  const res = await fetch(`${origin}/health`);
  if (res.status === 200) {
    pushResult("health", "PASS", "Backend health endpoint returned 200");
    return;
  }

  pushResult("health", "FAIL", `Expected 200, got ${res.status}`);
};

const run = async () => {
  printHeader();

  try {
    await healthCheck();

    const register = await request("/auth/register", {
      method: "POST",
      body: {
        username,
        email,
        password,
        firstName: "Test",
        lastName: "User"
      }
    });

    if (register.status === 201 && register.data?.success) {
      pushResult("register", "PASS", "User created successfully");
    } else {
      pushResult(
        "register",
        "FAIL",
        register.data?.error?.message || `Unexpected response status ${register.status}`
      );
    }

    const login = await request("/auth/login", {
      method: "POST",
      body: { identifier: email, password }
    });

    const accessToken = login.data?.data?.accessToken;
    if (login.status === 200 && login.data?.success && accessToken) {
      pushResult("login", "PASS", "Login succeeded and access token returned");
    } else {
      pushResult("login", "FAIL", login.data?.error?.message || `Unexpected status ${login.status}`);
    }

    if (!accessToken) {
      throw new Error("Cannot continue smoke test because no access token was returned.");
    }

    const me = await request("/auth/me", { token: accessToken });
    if (me.status === 200 && me.data?.success && me.data?.data?.email === email) {
      pushResult("auth/me", "PASS", "Authenticated user matches registered email");
    } else {
      pushResult("auth/me", "FAIL", me.data?.error?.message || `Unexpected status ${me.status}`);
    }

    const profile = await request("/users/profile", { token: accessToken });
    if (profile.status === 200 && profile.data?.success) {
      pushResult("profile.get", "PASS", "Profile fetched successfully");
    } else {
      pushResult("profile.get", "FAIL", profile.data?.error?.message || `Unexpected status ${profile.status}`);
    }

    const profileUpdate = await request("/users/profile", {
      method: "PUT",
      token: accessToken,
      body: {
        firstName: "QA",
        lastName: "Run"
      }
    });

    if (
      profileUpdate.status === 200 &&
      profileUpdate.data?.success &&
      profileUpdate.data?.data?.firstName === "QA" &&
      profileUpdate.data?.data?.lastName === "Run"
    ) {
      pushResult("profile.put", "PASS", "Profile update persisted expected first/last names");
    } else {
      pushResult(
        "profile.put",
        "FAIL",
        profileUpdate.data?.error?.message || `Unexpected profile update response ${profileUpdate.status}`
      );
    }

    const jobs = await request("/jobs?limit=5", { token: accessToken });
    if (jobs.status === 200 && jobs.data?.success) {
      let count = Array.isArray(jobs.data?.data) ? jobs.data.data.length : 0;

      if (count === 0) {
        const seed = await request("/jobs/seed");
        const afterSeed = await request("/jobs?limit=5", { token: accessToken });
        count = Array.isArray(afterSeed.data?.data) ? afterSeed.data.data.length : 0;

        if (count > 0) {
          pushResult("jobs.list", "PASS", `Returned ${count} jobs after auto-seed`);
        } else {
          const seedMessage = seed.data?.data?.message || seed.data?.error?.message || "seed unavailable";
          pushResult("jobs.list", "WARN", `No jobs returned after auto-seed attempt (${seedMessage})`);
        }
      } else {
        pushResult("jobs.list", "PASS", `Returned ${count} jobs`);
      }
    } else {
      pushResult("jobs.list", "FAIL", jobs.data?.error?.message || `Unexpected status ${jobs.status}`);
    }
  } catch (error) {
    pushResult("runner", "FAIL", error instanceof Error ? error.message : String(error));
  }

  console.log("\n========================================");
  const passCount = results.filter((r) => r.status === "PASS").length;
  const warnCount = results.filter((r) => r.status === "WARN").length;
  const failCount = results.filter((r) => r.status === "FAIL").length;
  console.log(`PASS: ${passCount} | WARN: ${warnCount} | FAIL: ${failCount}`);
  console.log("========================================");

  if (failCount > 0) {
    process.exit(1);
  }
};

run();