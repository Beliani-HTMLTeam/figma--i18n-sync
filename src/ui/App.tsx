import FrameCard, { CloneCard } from "./components/FrameCard.tsx";
import GenerateButton from "./components/GenerateButton.tsx";
import ResizeHandle from "./components/ResizeHandle.tsx";
import ResultBanner from "./components/ResultBanner.tsx";
import { useFrameConfigs } from "./hooks/useFrameConfigs.ts";

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

const EmptyState = ({ ignoredCount }: { ignoredCount: number }) => (
  <div className="emptyState">
    <p>No frames selected.</p>
    <p>
      Select one or more frames on the canvas. The list updates automatically.
    </p>
    {ignoredCount > 0 && (
      <p>
        {plural(ignoredCount, "selected layer")}{" "}
        {ignoredCount === 1 ? "is" : "are"} not a frame (groups, components,
        instances and sections are not supported).
      </p>
    )}
  </div>
);

const App = () => {
  const {
    frames,
    editableCount,
    ignoredCount,
    dateValue,
    setDateValue,
    isDateUsed,
    isGenerating,
    result,
    dismissResult,
    canGenerate,
    issueCount,
    globalIssues,
    issuesByFrame,
    getConfig,
    updateConfig,
    applyToOthers,
    generate,
    renameFrame,
  } = useFrameConfigs();

  const status = [
    plural(editableCount, "frame"),
    ignoredCount > 0 && `${ignoredCount} ignored`,
    issueCount > 0 && `${plural(issueCount, "issue")} to fix`,
    ...globalIssues,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="panel">
      <section className="cards" aria-label="Frame list">
        {frames.length === 0 ? (
          <EmptyState ignoredCount={ignoredCount} />
        ) : (
          frames.map((frame) =>
            frame.generatedFrom ? (
              <CloneCard key={frame.id} frame={frame} />
            ) : (
              <FrameCard
                key={frame.id}
                frame={frame}
                config={getConfig(frame)}
                dateValue={dateValue}
                issues={issuesByFrame[frame.id] ?? []}
                onChange={(key, value) => updateConfig(frame, key, value)}
                onRename={(name) => renameFrame(frame.id, name)}
                onApplyToOthers={
                  editableCount > 1 ? () => applyToOthers(frame) : undefined
                }
              />
            ),
          )
        )}
      </section>

      {result && <ResultBanner result={result} onDismiss={dismissResult} />}

      <footer className="footer">
        <label className={`dateField ${isDateUsed ? "" : "dateField--unused"}`}>
          <span className="labelText">
            Date
            {!isDateUsed && (
              <span className="labelHint">unused, add %date% to a suffix</span>
            )}
          </span>
          <input
            value={dateValue}
            onChange={(event) => setDateValue(event.target.value)}
          />
        </label>
        <span className="footerStatus">{status}</span>
        <GenerateButton
          isGenerating={isGenerating}
          disabled={!canGenerate || isGenerating}
          onClick={generate}
        />
      </footer>

      <ResizeHandle />
    </div>
  );
};

export default App;
