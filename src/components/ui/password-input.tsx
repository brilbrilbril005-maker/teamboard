"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import { IconButton } from "./icon-button";
import { Input, type InputProps } from "./input";

export type PasswordInputProps = Omit<InputProps, "type" | "endSlot">;

/** Поле пароля с замком слева и кнопкой «показать/скрыть пароль» справа. */
export function PasswordInput({ icon = <Lock />, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      {...props}
      icon={icon}
      type={visible ? "text" : "password"}
      endSlot={
        <IconButton
          size="sm"
          label={visible ? "Скрыть пароль" : "Показать пароль"}
          aria-pressed={visible}
          icon={visible ? <EyeOff /> : <Eye />}
          onClick={() => setVisible((current) => !current)}
          disabled={props.disabled}
        />
      }
    />
  );
}
