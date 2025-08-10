import Navbar from "../components/Navbar";


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
      >
        Welcome to the homepage!
      </div>
    </>
  );
}

export default HomePage;
