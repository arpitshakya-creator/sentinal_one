import { Routes, Route } from "react-router-dom";
import { NavBar } from "./components/NavBar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Graph from "./pages/Graph.jsx";
import Simulator from "./pages/Simulator.jsx";
import Mitigation from "./pages/Mitigation.jsx";

export default function App() {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-[1500px] px-5 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/graph" element={<Graph />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/mitigation" element={<Mitigation />} />
        </Routes>
      </main>
    </>
  );
}
