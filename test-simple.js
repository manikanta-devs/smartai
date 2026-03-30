const http = require("http");

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 5000,
      path,
      method,
      headers: {
        "Content-Type": "application/json"
      }
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            body: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body
          });
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function test() {
  try {
    console.log("Testing registration...");
    const res = await makeRequest("POST", "/api/auth/register", {
      email: `test-${Date.now()}@test.com`,
      username: `user_${Date.now()}`,
      password: "TestPassword123!",
      firstName: "John",
      lastName: "Doe"
    });
    
    console.log("Response status:", res.status);
    console.log("Response body:", JSON.stringify(res.body, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
