import React from "react";
import { MentionsInput, Mention, type MentionProps } from "react-mentions";
import "./mention-input.css"; // Import custom styles

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  data: { id: string; display: string }[];
}

export function MentionInput({ value, onChange, placeholder, data }: MentionInputProps) {
  const mentionStyle: MentionProps['style'] = {
    backgroundColor: 'hsl(var(--accent))',
    color: 'hsl(var(--accent-foreground))',
    borderRadius: '4px',
    padding: '1px 3px',
  };

  return (
    <MentionsInput
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mentions-input"
      classNames={{
        control: 'mentions-input__control',
        highlighter: 'mentions-input__highlighter',
        input: 'mentions-input__input',
        suggestions: {
          list: 'mentions-input__suggestions__list',
          item: 'mentions-input__suggestions__item',
          itemFocused: 'mentions-input__suggestions__item--focused',
        },
      }}
    >
      <Mention
        trigger="@"
        data={data}
        markup="@[__display__](user:__id__)"
        style={mentionStyle}
        displayTransform={(id, display) => `@${display}`}
        appendSpaceOnAdd
      />
    </MentionsInput>
  );
}