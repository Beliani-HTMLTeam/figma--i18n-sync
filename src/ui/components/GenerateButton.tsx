type Props = {
  isGenerating: boolean;
  disabled: boolean;
  onClick: () => void;
};

const GenerateButton = ({ isGenerating, disabled, onClick }: Props) => (
  <button
    className="primary"
    type="button"
    onClick={onClick}
    disabled={disabled}
  >
    {isGenerating ? (
      <span className="buttonLoading">
        <span className="spinner" />
        Generating...
      </span>
    ) : (
      "Generate translated frames"
    )}
  </button>
);

export default GenerateButton;
