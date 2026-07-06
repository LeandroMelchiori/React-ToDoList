import './ChangeAlert.css';
import { useStorageListener } from "./useStorageListener";

function ChangeAlert({ syncTodos }) {
    const { show, toggleShow } = useStorageListener(syncTodos);

    if (show) {
        return (
            <div className="ChangeAlert" role="alertdialog" aria-label="Cambios externos detectados">
                <div className="ChangeAlert-card">
                    <p>Hay cambios guardados en otra pestana.</p>
                    <button type="button" onClick={toggleShow}>Actualizar tareas</button>
                </div>
            </div>
        );  
    }

    return null;
}

export { ChangeAlert};
