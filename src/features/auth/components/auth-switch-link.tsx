import Link from "next/link";

/** Строка под формой: «Нет аккаунта? Зарегистрироваться». */
export function AuthSwitchLink({
  question,
  href,
  label,
}: {
  readonly question: string;
  readonly href: string;
  readonly label: string;
}) {
  return (
    <p className="text-body text-muted text-center text-balance">
      {question}{" "}
      <Link
        href={href}
        className="text-primary-text rounded-sm font-medium underline-offset-4 hover:underline"
      >
        {label}
      </Link>
    </p>
  );
}
