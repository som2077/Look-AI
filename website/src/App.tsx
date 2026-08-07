import "./App.css";
import Navbar from "./components/Navbar";

function App() {
  return (
    <>
      <Navbar />

      {/* Demo content so scroll works */}
      <main className="main-content">
        <div className="hero">
          <h1>Look AI</h1>
          <p>Your AI-powered style companion</p>
        </div>
      </main>
    </>
  );
}

export default App;
