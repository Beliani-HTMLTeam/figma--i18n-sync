import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usesDateToken } from "../../shared/naming";
import type { GenerationReport } from "../../shared/types";
import { formatCompactDate } from "../lib/date";
import {
  createDefaultConfig,
  getConfigIssues,
  mergeFrameConfig,
  pickSharedSettings,
} from "../lib/config";
import { postToPlugin, usePluginMessages } from "../lib/messaging";
import type { FrameConfig, FrameInfo, PluginMessage } from "../types";

type ConfigMap = Record<string, FrameConfig>;

export type GenerationResult =
  | { status: "completed"; report: GenerationReport }
  | { status: "failed"; error: string };

const SAVE_DELAY_MS = 400;

function useDebouncedConfigSave() {
  const pending = useRef(new Map<string, FrameConfig>());
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    pending.current.forEach((config, frameId) =>
      postToPlugin({ type: "SAVE_FRAME_CONFIG", frameId, config }),
    );
    pending.current.clear();
  }, []);

  const schedule = useCallback(
    (entries: Array<[string, FrameConfig]>) => {
      entries.forEach(([frameId, config]) =>
        pending.current.set(frameId, config),
      );
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, SAVE_DELAY_MS);
    },
    [flush],
  );

  useEffect(() => {
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [flush]);

  return { schedule, flush };
}

export function useFrameConfigs() {
  const [frames, setFrames] = useState<FrameInfo[]>([]);
  const [ignoredCount, setIgnoredCount] = useState(0);
  const [configs, setConfigs] = useState<ConfigMap>({});
  const [dateValue, setDateValue] = useState(formatCompactDate);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const saver = useDebouncedConfigSave();

  usePluginMessages((message: PluginMessage) => {
    if (message.type === "GENERATION_STATUS") {
      setIsGenerating(message.status === "running");
      if (message.status !== "running") {
        setResult(message);
      }
      return;
    }

    if (message.type === "POST_SELECTION_FRAMES") {
      setFrames(message.frames);
      setIgnoredCount(message.ignoredCount);
      setConfigs((previous) => {
        const next = { ...previous };
        message.frames.forEach((frame) => {
          next[frame.id] = mergeFrameConfig(frame, previous[frame.id]);
        });
        return next;
      });
    }
  });

  const editableFrames = useMemo(
    () => frames.filter((frame) => !frame.generatedFrom),
    [frames],
  );

  const getConfig = useCallback(
    (frame: FrameInfo) => configs[frame.id] ?? createDefaultConfig(frame),
    [configs],
  );

  const updateConfig = useCallback(
    <K extends keyof FrameConfig>(
      frame: FrameInfo,
      key: K,
      value: FrameConfig[K],
    ) => {
      setConfigs((previous) => {
        const config = {
          ...(previous[frame.id] ?? createDefaultConfig(frame)),
          [key]: value,
        };
        saver.schedule([[frame.id, config]]);
        return { ...previous, [frame.id]: config };
      });
    },
    [saver],
  );

  const applyToOthers = useCallback(
    (source: FrameInfo) => {
      setConfigs((previous) => {
        const shared = pickSharedSettings(
          previous[source.id] ?? createDefaultConfig(source),
        );
        const next = { ...previous };
        const changed: Array<[string, FrameConfig]> = [];
        editableFrames
          .filter((frame) => frame.id !== source.id)
          .forEach((frame) => {
            next[frame.id] = {
              ...(next[frame.id] ?? createDefaultConfig(frame)),
              ...shared,
            };
            changed.push([frame.id, next[frame.id]]);
          });
        saver.schedule(changed);
        return next;
      });
    },
    [editableFrames, saver],
  );

  const issuesByFrame = useMemo(
    () =>
      Object.fromEntries(
        editableFrames.map((frame) => [
          frame.id,
          getConfigIssues(getConfig(frame)),
        ]),
      ),
    [editableFrames, getConfig],
  );

  const isDateUsed = editableFrames.some((frame) =>
    usesDateToken(getConfig(frame).nameSuffix),
  );
  const globalIssues = isDateUsed && !dateValue.trim() ? ["Date is empty"] : [];
  const issueCount =
    globalIssues.length +
    Object.values(issuesByFrame).reduce(
      (sum, issues) => sum + issues.length,
      0,
    );
  const canGenerate = editableFrames.length > 0 && issueCount === 0;

  const generate = () => {
    if (!canGenerate) {
      return;
    }
    saver.flush();
    setResult(null);
    setIsGenerating(true);
    postToPlugin({
      type: "GENERATE_TRANSLATED_FRAMES",
      dateValue: dateValue.trim(),
      items: editableFrames.map((frame) => ({
        frameId: frame.id,
        config: getConfig(frame),
      })),
    });
  };

  const renameFrame = (frameId: string, name: string) =>
    postToPlugin({ type: "RENAME_FRAME", frameId, name });

  return {
    frames,
    editableCount: editableFrames.length,
    ignoredCount,
    dateValue,
    setDateValue,
    isDateUsed,
    isGenerating,
    result,
    dismissResult: () => setResult(null),
    canGenerate,
    issueCount,
    globalIssues,
    issuesByFrame,
    getConfig,
    updateConfig,
    applyToOthers,
    generate,
    renameFrame,
  };
}
