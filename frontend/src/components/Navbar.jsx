import { NavLink } from "react-router-dom";
import Container from "react-bootstrap/Container";
import RBNavbar from "react-bootstrap/Navbar";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import HamburgerMenu from "./HamburgerMenu";
import SearchBar from "./SearchBar";
import CartButton from "./CartButton";

export default function Navbar() {
  return (
    <RBNavbar
      bg="white"
      className="border-bottom sticky-top shadow-sm py-3"
      role="navigation"
    >
      <Container fluid="xl">
        <Row className="align-items-center g-3 flex-nowrap w-100">
          {/* Logo + Meny */}
          <Col xs="auto" className="d-flex align-items-center gap-2 flex-shrink-0">
            <RBNavbar.Brand
              as={NavLink}
              to="/"
              className="d-flex align-items-center text-decoration-none"
            >
              <img src="src/assets/react.svg" alt="TekStuff" className="brand-logo me-1" />
            </RBNavbar.Brand>
            <HamburgerMenu label="Meny" />
          </Col>

          {/* Search — takes all available middle space */}
          <Col className="flex-grow-1">
            <SearchBar />
          </Col>

          {/* Cart */}
          <Col xs="auto" className="flex-shrink-0">
            <CartButton />
          </Col>
        </Row>
      </Container>
    </RBNavbar>
  );
}
