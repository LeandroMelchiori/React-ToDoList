import { IoIosCheckmarkCircle as CheckSVG } from "react-icons/io";
import { GiCancel as DeleteSVG } from "react-icons/gi";
import '../css/TodoIcon.css';

const iconTypes = {
    "check": (color) => <CheckSVG className="icon-svg" fill={color} />,
    "delete": (color) => <DeleteSVG className="icon-svg" fill={color} />
}

function TodoIcon({type, color, onClick}) {
    return (
        <span
            className={`Icon-container Icon-svg Icon-container-${type}`}
            onClick={onClick}
        >
            {iconTypes[type](color)}
        </span>
    );
}

export { TodoIcon };