import './TodoIcon.css';

const iconTypes = {
    check: {
        paths: ['M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.15 14.15-4-4 1.42-1.42 2.58 2.59 5.88-5.89 1.42 1.42-7.3 7.3z'],
        viewBox: '0 0 24 24',
    },
    delete: {
        paths: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4.24 12.83-1.41 1.41L12 13.41l-2.83 2.83-1.41-1.41L10.59 12 7.76 9.17l1.41-1.41L12 10.59l2.83-2.83 1.41 1.41L13.41 12l2.83 2.83z'],
        viewBox: '0 0 24 24',
    },
    edit: {
        paths: ['M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2 1.58 9.06-9.06 1.17 1.17L6.17 20H5v-1.17z', 'M18.71 8.04a1 1 0 0 0 0-1.41l-1.34-1.34a1 1 0 0 0-1.41 0l-1.05 1.05 3.75 3.75 1.05-1.05z'],
        viewBox: '0 0 24 24',
    },
    moveDown: {
        paths: ['M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z'],
        viewBox: '0 0 24 24',
    },
    moveUp: {
        paths: ['M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z'],
        viewBox: '0 0 24 24',
    },
};

function IconSvg({ color, icon }) {
    return (
        <svg
            aria-hidden="true"
            className="icon-svg"
            fill={color}
            focusable="false"
            viewBox={icon.viewBox}
        >
            {icon.paths.map(path => (
                <path d={path} key={path} />
            ))}
        </svg>
    );
}

function TodoIcon({ disabled = false, type, color, label, onClick }) {
    const icon = iconTypes[type];

    return (
        <button
            type="button"
            className={`Icon-container Icon-svg Icon-container-${type}`}
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
        >
            <IconSvg color={color} icon={icon} />
        </button>
    );
}

export { TodoIcon };
