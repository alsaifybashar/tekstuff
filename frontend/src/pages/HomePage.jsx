import Navbar from "../components/Navbar";
import CategoryStrip from "../components/CategoryStrip";

function HomePage() {
  return (
    <>
      <Navbar />

      <div
        style={{
          width: "80vw",
          textAlign: "center",
          fontSize: "3rem",
          marginTop: "3rem",
        }}
      ></div>

      <CategoryStrip onSelect={(id) => console.log("Selected:", id)} />
    </>
  );
}

export default HomePage;
