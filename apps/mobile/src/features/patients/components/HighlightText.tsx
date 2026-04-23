import { Text } from 'react-native-paper';

interface Props {
  text: string;
  highlight: string;
  style?: object;
  numberOfLines?: number;
}

export function HighlightText({ text, highlight, style, numberOfLines }: Props): React.JSX.Element {
  if (!highlight || highlight.length < 2) {
    return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;
  }

  const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <Text key={i} style={{ fontWeight: 'bold', color: '#0d9488' }}>{part}</Text>
        ) : (
          part
        )
      )}
    </Text>
  );
}
