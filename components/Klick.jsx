// components/Klick.jsx
// KLICK은 서비스 고유명사이므로 Google 번역 위젯이 다른 언어의 일반 단어로
// 오역하지 않도록 어디서든 이 컴포넌트로 감싸서 렌더링한다.
export default function Klick() {
  return <span className="notranslate" translate="no">KLICK</span>;
}

// 문단 형태의 순수 문자열(terms/privacy 등) 안에 섞인 "KLICK"을 보호하고 싶을 때 사용.
export function protectKlick(text) {
  return text.split(/(KLICK)/g).map((part, i) =>
    part === 'KLICK' ? <Klick key={i} /> : part
  );
}
