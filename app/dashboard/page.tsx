import publicApi from "@/lib/api";
import { cookies } from "next/headers";
export const instant = false

export default async function Dashboard() {
    const cookieStore = await cookies();
    const res = await publicApi.get('/user', {
        headers: {
            Authorization: `Bearer ${cookieStore.get('token')?.value}`,
        },
    });
    const users = res.data;
  return (
    <main style={{ maxWidth: 380, margin: '80px auto' }}>
      <ul>
        {users.map((user: any) => (
          <li key={user.id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul>
    </main>
  );

;
}