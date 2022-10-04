import {Col, Container, Row} from "react-bootstrap";
import logo from "../assets/img/studying.png";
import githubIcon from '../assets/img/icons8-github-16.svg';


export const Footer = () => {
  return (
    <footer className="footer">
      <Container>
        <Row className="align-items-center">
          <Col size={12} sm={6}>
            <img src={logo} alt="Logo" />
          </Col>
          <Col size={12} sm={6} className="text-center text-sm-end">
            <div className="social-icon">
              <a rel="noopener noreferrer" target="_blank"  href="https://github.com/Flowdawan"><img src={githubIcon} alt="Github Link" /></a>
            </div>
            <p>Copyright {new Date().getFullYear()}. All Rights Reserved</p>
          </Col>
        </Row>
      </Container>
    </footer>
  )
}
