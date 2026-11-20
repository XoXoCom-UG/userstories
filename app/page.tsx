import { Admitted } from "@/components/admitted";
import { Header } from "@/components/header";
import { RequireAuth } from "@/components/require-auth";
import { Workbench } from "@/components/workbench";

export default function Home() {
  return (
    <RequireAuth>
      <Admitted>
        <div className="app">
          <Header />
          <main className="main" id="main-content">
            <div className="hero">
              <h1>User Story Schneider</h1>
              {/* The three steps, as a flow: the arrow between them is the only decoration. */}
              <ol className="flow" aria-label="How it works">
                <li>Describe your project</li>
                <li>We cut it into stories</li>
                <li>Get stories and a roadmap</li>
              </ol>
            </div>
            <Workbench />
          </main>
        </div>
      </Admitted>
    </RequireAuth>
  );
}
