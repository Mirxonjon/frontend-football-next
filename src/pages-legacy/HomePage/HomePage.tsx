"use client";

import Statistics from "../../components/ui/Statistics/Statistics";
import Description from "../../components/ui/Description/Description";
import MySilder from "../../components/ui/Slider/Slider";
import Footer from "../../components/ui/Footer/Footer";
import Container from "../../components/ui/Container/Container";
function Home() {
  return (
    <>
      <Container>
        <Description />
        <MySilder />
        <Statistics />
      </Container>
      <Footer />
    </>
  );
}

export default Home;