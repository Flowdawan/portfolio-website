import {Col} from "react-bootstrap";

export const ProjectCard = ({ title, description, imgUrl, projectLink }) => {
  return (
    <Col size={12} sm={6} md={4}>
        <a className="projectCardsLink" href={projectLink} rel="noopener noreferrer" target="_blank">
          <div className="proj-imgbx">
            <img src={imgUrl} alt="Project Logo" />
            <div className="proj-txtx">
              <h4>{title}</h4>
              <span>{description}</span>
            </div>
          </div>
        </a>
    </Col>
  )
}
