import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { ArrowLeft, Mail, Save, Loader2, LogOut, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "../store/auth";
import api from "../lib/api";

interface Profile {
  id?: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role?: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    email: user?.email || "",
    username: user?.username || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    avatar: "",
    role: user?.role || "FREE"
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/profile");
      if (response.data.data) {
        setProfile((prev) => ({ ...prev, ...response.data.data }));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile((prev) => ({ ...prev, email: user?.email || "" }));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const payload = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatar: profile.avatar
      };
      const response = await api.put("/users/profile", payload);
      if (response.data.success) {
        const updated = response.data.data;
        setProfile((prev) => ({ ...prev, ...updated }));
        useAuthStore.setState({ user: { ...useAuthStore.getState().user!, ...updated } });
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      toast.error("Failed to save profile");
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="max-w-3xl mx-auto px-0 py-0">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
        </div>

        {/* Profile Form */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl shadow-indigo-950/20">
            <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  disabled
                  className="bg-[#04050f]"
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Username
                </label>
                <Input
                  type="text"
                  value={profile.username || ""}
                  disabled
                  className="bg-[#04050f]"
                />
                <p className="text-xs text-slate-500 mt-1">Username cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  First Name
                </label>
                <Input
                  type="text"
                  value={profile.firstName || ""}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Last Name
                </label>
                <Input
                  type="text"
                  value={profile.lastName || ""}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
          </div>

          {/* Account Snapshot */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl shadow-indigo-950/20">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <UserCircle2 className="w-5 h-5" />
              Account Snapshot
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 bg-[#04050f] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Plan</p>
                <p className="mt-2 text-sm text-slate-100">{profile.role || "FREE"}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#04050f] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Display Name</p>
                <p className="mt-2 text-sm text-slate-100">{[profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Not set"}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 flex-1"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Cancel
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
