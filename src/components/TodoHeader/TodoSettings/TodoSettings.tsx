import {
  TodoDefaultView,
  TodoDensity,
  TodoSettings as TodoSettingsValue,
} from '../../../App/useTodoSettings';
import './TodoSettings.css';

interface TodoSettingsProps {
  loading?: boolean;
  onChange: (settings: Partial<TodoSettingsValue>) => void;
  settings: TodoSettingsValue;
}

function TodoSettings({ loading = false, onChange, settings }: TodoSettingsProps) {
  return (
    <section className="TodoSettings" aria-labelledby="todo-settings-title">
      <div className="TodoSettings-heading">
        <h3 id="todo-settings-title">Ajustes</h3>
        <span>Preferencias guardadas en este navegador</span>
      </div>
      <div className="TodoSettings-fields">
        <label>
          Vista inicial
          <select
            value={settings.defaultView}
            disabled={loading}
            onChange={(event) => onChange({ defaultView: event.target.value as TodoDefaultView })}
          >
            <option value="list">Lista</option>
            <option value="today">Hoy</option>
            <option value="board">Tablero</option>
            <option value="calendar">Calendario</option>
            <option value="week">Semana</option>
          </select>
        </label>
        <label>
          Densidad
          <select
            value={settings.density}
            disabled={loading}
            onChange={(event) => onChange({ density: event.target.value as TodoDensity })}
          >
            <option value="comfortable">Comoda</option>
            <option value="compact">Compacta</option>
          </select>
        </label>
        <label className="TodoSettings-toggle">
          <input
            type="checkbox"
            checked={settings.showQuickAdd}
            disabled={loading}
            onChange={(event) => onChange({ showQuickAdd: event.target.checked })}
          />
          Mostrar captura rapida
        </label>
      </div>
    </section>
  );
}

export { TodoSettings };
