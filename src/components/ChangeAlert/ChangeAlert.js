import React from "react";
import './ChangeAlert.css';
import { useStorageListener } from "./useStorageListener";

function ChangeAlert(sincronize) {
    const { show, toggleShow } = useStorageListener(sincronize);

    if (show) {
        return (
            <div className="ChangeAlert">
                <p>Hubo cambios</p>
                <button onClick={() => toggleShow(false)}>Recargar</button>
            </div>
        );  
    } else {
        return null;
    }
}

export { ChangeAlert};