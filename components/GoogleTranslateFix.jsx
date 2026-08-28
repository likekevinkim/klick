'use client';

// 구글 번역 위젯이 텍스트 노드를 <font> 태그로 직접 감싸버리면, 리액트가 알고 있는 DOM
// 구조와 실제 DOM이 어긋난다. 그 상태에서 리액트가 리렌더링하며 노드를 지우거나 옮기려 하면
// "Failed to execute 'removeChild'/'insertBefore' on 'Node': ...not a child of this node" 런타임
// 에러로 화면이 죽는다 (구글 번역 + 리액트 조합에서 널리 알려진 문제).
// 실제 부모-자식 관계를 확인해서, 어긋난 경우에만 조용히 건너뛰도록 방어한다.
if (typeof window !== 'undefined' && !Node.prototype.__klickTranslateFixApplied) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) return child;
    return originalRemoveChild.call(this, child);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) return newNode;
    return originalInsertBefore.call(this, newNode, referenceNode);
  };

  Node.prototype.__klickTranslateFixApplied = true;
}

export default function GoogleTranslateFix() {
  return null;
}
