import { IoIosCheckmarkCircle as CheckSVG } from "react-icons/io";
import { GiCancel as DeleteSVG } from "react-icons/gi";
import { MdEdit as EditSVG } from "react-icons/md";
import { MdKeyboardArrowDown as MoveDownSVG, MdKeyboardArrowUp as MoveUpSVG } from "react-icons/md";
import './TodoIcon.css';

const iconTypes = {
    "check": (color) => <CheckSVG className="icon-svg" fill={color} />,
    "delete": (color) => <DeleteSVG className="icon-svg" fill={color} />,
    "edit": (color) => <EditSVG className="icon-svg" fill={color} />,
    "moveDown": (color) => <MoveDownSVG className="icon-svg" fill={color} />,
    "moveUp": (color) => <MoveUpSVG className="icon-svg" fill={color} />
}

function TodoIcon({ disabled = false, type, color, label, onClick }) {
    return (
        <button
            type="button"
            className={`Icon-container Icon-svg Icon-container-${type}`}
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
        >
            {iconTypes[type](color)}
        </button>
    );
}

export { TodoIcon };
