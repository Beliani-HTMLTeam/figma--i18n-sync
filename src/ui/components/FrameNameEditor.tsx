import { useState, type KeyboardEvent } from "react";
import { Icon } from "@iconify/react";

type Props = {
  name: string;
  onCommit: (name: string) => void;
};

const ICON_SIZE = "14";

const FrameNameEditor = ({ name, onCommit }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const startEditing = () => {
    setDraft(name);
    setIsEditing(true);
  };

  const commit = () => {
    const nextName = draft.trim();
    if (nextName && nextName !== name) {
      onCommit(nextName);
    }
    setIsEditing(false);
  };

  const keyActions: Record<string, () => void> = {
    Enter: commit,
    Escape: () => setIsEditing(false),
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const action = keyActions[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  };

  return (
    <>
      {isEditing ? (
        <input
          aria-label="Frame name"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          autoFocus
        />
      ) : (
        <h2
          title={`${name} (double-click to rename)`}
          onDoubleClick={startEditing}
        >
          {name}
        </h2>
      )}
      <button
        type="button"
        className="iconButton"
        onMouseDown={(event) => event.preventDefault()}
        onClick={isEditing ? commit : startEditing}
        aria-label={isEditing ? "Confirm frame name" : "Rename frame"}
      >
        <Icon
          icon={isEditing ? "mdi:check-bold" : "mdi:pencil-outline"}
          width={ICON_SIZE}
          height={ICON_SIZE}
        />
      </button>
    </>
  );
};

export default FrameNameEditor;
