import { Header } from "@/components/header";
import { RequireAuth } from "@/components/require-auth";
import { Workbench } from "@/components/workbench";

export default function Home() {
  return (
    <RequireAuth>
      <div className="app">
        <Header />
        <main className="main" id="main-content">
          <div className="hero">
            <h1>User Story Schneider</h1>
            <p>Describe your project in a few sentences. Get user stories and a roadmap you can hand to a team.</p>
          </div>
          <Workbench />
        </main>
      </div>
    </RequireAuth>
  );
}
