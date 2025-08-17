import Container from "react-bootstrap/Container";
import "./Footer.css";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

export default function Footer() {
  return (
    <footer className="footer-dark mt-5">

      {/* Feature strip */}
      <div className="footer-features border-bottom border-opacity-25">
        <Container>
          <Row className="text-center g-4 py-4">
            <Col md>
              <div className="feature">
                <i className="bi bi-bag fs-1 d-block" aria-hidden="true"></i>
                <div className="fw-semibold">Boka & hämta inom 30 min</div>
              </div>
            </Col>
            <Col md>
              <div className="feature">
                <i className="bi bi-arrow-counterclockwise fs-1 d-block" aria-hidden="true"></i>
                <div className="fw-semibold">50 dagars öppet köp</div>
              </div>
            </Col>
            <Col md>
              <div className="feature">
                <i className="bi bi-bullseye fs-1 d-block" aria-hidden="true"></i>
                <div className="fw-semibold">Prismatch</div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Link columns */}
      <div className="py-5">
        <Container>
          <Row className="g-4">
            {/* Brand + legal */}
            <Col md={4}>
              <img
                src="src/assets/react.svg"
                alt="TekStuff"
                height={36}
                className="mb-3"
              />
              <div className="small text-secondary">
                ©2025 TekStuff AB. All rights reserved.
                <br /> Organisationsnummer: 556471-4474.
              </div>
              <ul className="list-unstyled small mt-3">
                <li><a href="/terms" className="link-light link-offset-2">Köpvillkor</a></li>
                <li><a href="/cookies" className="link-light link-offset-2">Cookies</a></li>
                <li><a href="/brands" className="link-light link-offset-2">Varumärken</a></li>
              </ul>
            </Col>

            {/* Link groups */}
            <Col xs={6} md={2}>
              <h6 className="text-uppercase text-secondary fw-bold">Kundtjänst</h6>
              <ul className="list-unstyled">
                <li><a className="link-light" href="/support">Kundtjänst</a></li>
                <li><a className="link-light" href="/stores">Hitta butik</a></li>
                <li><a className="link-light" href="/track">Spåra din leverans</a></li>
                <li><a className="link-light" href="/contact">Kontakta oss</a></li>
              </ul>
            </Col>

            <Col xs={6} md={2}>
              <h6 className="text-uppercase text-secondary fw-bold">Information</h6>
              <ul className="list-unstyled">
                <li><a className="link-light" href="/install">Installation</a></li>
                <li><a className="link-light" href="/privacy">Personuppgiftspolicy</a></li>
                <li><a className="link-light" href="/whistle">Visselblåsning</a></li>
              </ul>
            </Col>

            <Col xs={6} md={2}>
              <h6 className="text-uppercase text-secondary fw-bold">Inspiration</h6>
              <ul className="list-unstyled">
                <li><a className="link-light" href="/campaigns">Kampanjer</a></li>
                <li><a className="link-light" href="/guides">Guider & inspiration</a></li>
              </ul>
            </Col>

            <Col xs={6} md={2}>
              <h6 className="text-uppercase text-secondary fw-bold">Om oss</h6>
              <ul className="list-unstyled">
                <li><a className="link-light" href="/about">Om företaget</a></li>
                <li><a className="link-light" href="/jobs">Jobba hos oss</a></li>
                <li><a className="link-light" href="/press">Pressrum</a></li>
              </ul>
            </Col>
          </Row>
        </Container>
      </div>

    </footer>
  );
}
