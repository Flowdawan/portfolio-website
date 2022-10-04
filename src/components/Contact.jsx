import {Col, Container, Row} from "react-bootstrap";
import contactImg from "../assets/img/contact-img.svg";
import 'animate.css';
import TrackVisibility from 'react-on-screen';

export const Contact = () => {
  return (
      <section className="contact" id="connect">
        <Container>
          <Row className="align-items-center">
            <Col size={12} md={6}>
              <TrackVisibility>
                {({isVisible}) =>
                    <img className={isVisible ? "animate__animated animate__zoomIn" : ""} src={contactImg}
                         alt="Contact Us"/>
                }
              </TrackVisibility>
            </Col>
            <Col size={12} md={6}>
              <TrackVisibility>
                {({isVisible}) =>
                    <div className={isVisible ? "animate__animated animate__fadeIn" : ""}>
                      <h2>Get In Touch</h2>
                      <p>If you've made it this far, grab yourself another coffee, or tea, and drop me an <a className="anchorButton" href="mailto:vc@deflow.at">email</a>.</p>
                    </div>}
              </TrackVisibility>
            </Col>
          </Row>
        </Container>
      </section>
  )
}