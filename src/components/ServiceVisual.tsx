import type { ServiceId } from "../lib/services";

type Props = { id: ServiceId; compact?: boolean };

export function ServiceVisual({ id, compact }: Props) {
  return (
    <div className={`viz viz-${id}${compact ? " is-compact" : ""}`} aria-hidden="true">
      {id === "fast" ? (
        <div className="viz-browser">
          <div className="viz-chrome">
            <i />
            <i />
            <i />
          </div>
          <div className="viz-screen">
            <b />
            <span />
            <span className="wide" />
            <div className="viz-stamp">3 DAYS</div>
          </div>
        </div>
      ) : null}

      {id === "crm" ? (
        <div className="viz-pipe">
          <div className="viz-person">
            <i />
            <b />
          </div>
          <div className="viz-person">
            <i />
            <b />
          </div>
          <div className="viz-check">✓</div>
        </div>
      ) : null}

      {id === "erp" ? (
        <div className="viz-mods">
          <span>STOCK</span>
          <span>BILL</span>
          <span>TEAM</span>
          <span>DATA</span>
        </div>
      ) : null}

      {id === "ai" ? (
        <div className="viz-ai">
          <strong>{"{+}"}</strong>
        </div>
      ) : null}
    </div>
  );
}
