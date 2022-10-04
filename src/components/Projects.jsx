import {Col, Container, Nav, Row, Tab} from "react-bootstrap";
import {ProjectCard} from "./ProjectCard";
import viennaCallingImg from "../assets/img/portViennaCalling.png";
import reactCalculator from "../assets/img/portReactCalculator.png";
import reactSupertrumpf from "../assets/img/portReactSupertrumpf.png";
import simplySmart from "../assets/img/portDjangoSimplySmart.png";
import androidCalculator from "../assets/img/portAndroidCalculator.png";
import notiFhyMe from "../assets/img/portFhyMe.png";

import lock from "../assets/img/lock.png";

import colorSharp2 from "../assets/img/color-sharp2.png";
import 'animate.css';
import TrackVisibility from 'react-on-screen';

export const Projects = () => {

  const projects = [
    {
      title: "Vienna Calling",
      description: "Android Mobile App",
      imgUrl: viennaCallingImg,
      projectLink: 'https://play.google.com/store/apps/details?id=at.deflow.viennacalling'
    },
    {
      title: "Supertrumpf",
      description: "React Web-Pokemon-Supertrumpf",
      imgUrl: reactSupertrumpf,
      projectLink: 'https://react.deflow.at/supertrumpf/',
    },
    {
      title: "Calculator",
      description: "React Web-Calculator",
      imgUrl: reactCalculator,
      projectLink: 'https://react.deflow.at/calculator/',
    },
    {
      title: "Android Calculator",
      description: "Jetpack Compose Calculator",
      imgUrl: androidCalculator,
      projectLink: 'https://github.com/Flowdawan/SimpleAndroidCalculator',
    },
    {
      title: "Simply Smart",
      description: "Django based learning platform",
      imgUrl: simplySmart,
      projectLink: 'https://github.com/Flowdawan/SimplySmart',
    },
    {
      title: "NotiFhy-Me",
      description: "Laravel based todo reminder",
      imgUrl: notiFhyMe,
      projectLink: 'https://github.com/Flowdawan/notifhyMe',
    },
  ];

  return (
    <section className="project" id="projects">
      <Container>
        <Row>
          <Col size={12}>
            <TrackVisibility>
              {({ isVisible }) =>
              <div className={isVisible ? "animate__animated animate__fadeIn": ""}>
                <h2>Projects</h2>
                <p>Here is a small selection of projects that I have hacked together so far. On my <a rel="noopener noreferrer" target="_blank" className="anchorButton" href="https://github.com/Flowdawan?tab=repositories">Github page</a> you can find the source code for most of these projects.

                  Also click on a project to learn more about it.</p>
                <Tab.Container id="projects-tabs" defaultActiveKey="first">
                  <Nav variant="pills" className="nav-pills mb-5 justify-content-center align-items-center" id="pills-tab">
                    <Nav.Item>
                      <Nav.Link eventKey="first">Projects 1</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link disabled="disabled" eventKey="second">Coming soon <img className="lockIcon" src={lock} alt="Lock" /></Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link disabled="disabled" eventKey="third">Coming later <img className="lockIcon" src={lock} alt="Lock" /></Nav.Link>
                    </Nav.Item>
                  </Nav>
                  <Tab.Content id="slideInUp" className={isVisible ? "animate__animated animate__slideInUp" : ""}>
                    <Tab.Pane eventKey="first">
                      <Row>
                        {
                          projects.map((project, index) => {
                            return (
                              <ProjectCard
                                key={index}
                                {...project}
                                />
                            )
                          })
                        }
                      </Row>
                    </Tab.Pane>
                    <Tab.Pane eventKey="second">
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque quam, quod neque provident velit, rem explicabo excepturi id illo molestiae blanditiis, eligendi dicta officiis asperiores delectus quasi inventore debitis quo.</p>
                    </Tab.Pane>
                    <Tab.Pane eventKey="third">
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque quam, quod neque provident velit, rem explicabo excepturi id illo molestiae blanditiis, eligendi dicta officiis asperiores delectus quasi inventore debitis quo.</p>
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
              </div>}
            </TrackVisibility>
          </Col>
        </Row>
      </Container>
      <img className="background-image-right" src={colorSharp2} alt="Background Color Gradient"></img>
    </section>
  )
}
