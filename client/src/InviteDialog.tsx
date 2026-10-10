import { useState } from "react";

function InviteDialog({ familySlug }: { familySlug: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [pending, setPending] = useState(false);

  const send = async () => {
    setPending(true);
    const r = await fetch(`/api/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, role }),
    });
    setPending(false);
    if (r.status === 403) alert("Insufficient role");
    if (r.status === 201) alert("Invite sent — token in response");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email"
        required
      />
      <select value={role} onChange={(e) => setRole(e.target.value as any)}>
        <option value="member">member</option>
        <option value="admin">admin</option>
      </select>
      <button type="submit" disabled={pending}>
        Send invite
      </button>
    </form>
  );
}
