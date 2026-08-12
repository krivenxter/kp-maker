type Issue = { path: PropertyKey[]; message: string };

type Props = {
  valid: boolean;
  issues: Issue[];
  onePagerWarnings: string[];
  showOnePagerWarnings: boolean;
  onIssueClick: (path: string) => void;
};

export function ValidationSummary({ valid, issues, onePagerWarnings, showOnePagerWarnings, onIssueClick }: Props) {
  return <>
    <div className={`validation-box ${valid ? 'success' : 'error'}`}>
      <b>{valid ? 'КП готово к экспорту' : `Найдено ошибок: ${issues.length}`}</b>
      {!valid && <ul>{issues.slice(0, 8).map((issue, index) => {
        const path = issue.path.map(String).join('.');
        return <li key={`${path}-${index}`}><button type="button" onClick={() => onIssueClick(path)}>{issue.message}</button></li>;
      })}</ul>}
    </div>
    {showOnePagerWarnings && onePagerWarnings.length > 0 && <div className="validation-box warning">
      <b>One-pager пока не поместится на один слайд</b>
      <ul>{onePagerWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
    </div>}
  </>;
}

