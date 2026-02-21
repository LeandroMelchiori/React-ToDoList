import React from "react";
import './ChangeAlert.css';
import { withStorageListener } from "./withStorageListener";

function ChangeAlert({ show, toggleShow }) {
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

const ChangeAlertWithStorageListener = withStorageListener(ChangeAlert);

export { ChangeAlertWithStorageListener };