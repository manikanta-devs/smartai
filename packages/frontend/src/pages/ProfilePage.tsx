import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Textarea } from "../components/Textarea";
import { ArrowLeft, Mail, Phone, MapPin, Link as LinkIcon, Save, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "../store/auth";
import api from "../lib/api";

interface Profile {
  email?: string;
  fullName?: string;
  phone?: string;
  location?: string;
  bio?: string;
  linkedIn?: string;
  github?: string;
  portfolio?: string;
  skills?: string[];
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    email: user?.email || "",
    fullName: "",
    phone: "",
    location: "",
    bio: "",
    linkedIn: "",
    github: "",
    portfolio: "",
    skills: []
  });
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/profile");
      if (response.data.data) {
        setProfile({ ...profile, ...response.data.data });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(prev => ({ ...prev, email: user?.email || "" }));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const response = await api.put("/users/profile", profile);
      if (response.data.success) {
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      toast.error("Failed to save profile");
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      const skills = profile.skills || [];
      if (!skills.includes(skillInput.trim())) {
        setProfile({
          ...profile,
          skills: [...skills, skillInput.trim()]
        });
        setSkillInput("");
      } else {
        toast.info("Skill already added");
      }
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setProfile({
      ...profile,
      skills: (profile.skills || []).filter(s => s !== skill)
    });
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
                  Full Name
                </label>
                <Input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Location
                </label>
                <Input
                  type="text"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="San Francisco, CA"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl shadow-indigo-950/20">
            <h2 className="text-xl font-semibold text-white mb-4">Professional Bio</h2>

            <label className="block text-sm font-semibold text-slate-300 mb-2">
              About You
            </label>
            <Textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Write a brief bio about yourself and your professional background..."
              rows={4}
            />
          </div>

          {/* Social Links */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl shadow-indigo-950/20">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Social & Portfolio Links
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  LinkedIn Profile
                </label>
                <Input
                  type="url"
                  value={profile.linkedIn}
                  onChange={(e) => setProfile({ ...profile, linkedIn: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  GitHub Profile
                </label>
                <Input
                  type="url"
                  value={profile.github}
                  onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                  placeholder="https://github.com/username"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Portfolio Website
                </label>
                <Input
                  type="url"
                  value={profile.portfolio}
                  onChange={(e) => setProfile({ ...profile, portfolio: e.target.value })}
                  placeholder="https://yourportfolio.com"
                />
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl shadow-indigo-950/20">
            <h2 className="text-xl font-semibold text-white mb-4">Professional Skills</h2>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Add Skills
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
                  placeholder="e.g., React, Node.js, Python..."
                />
                <Button onClick={handleAddSkill} size="sm" variant="outline">
                  Add
                </Button>
              </div>
            </div>

            {(profile.skills || []).length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-3">Your Skills:</p>
                <div className="flex flex-wrap gap-2">
                  {(profile.skills || []).map(skill => (
                    <div
                      key={skill}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-2"
                    >
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-1 hover:text-blue-900 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
