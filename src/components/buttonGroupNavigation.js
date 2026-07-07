const BUTTON_SELECTOR = 'button:not(:disabled)';

function getNextButtonIndex(eventKey, currentIndex, buttonCount) {
  if (eventKey === 'Home') {
    return 0;
  }

  if (eventKey === 'End') {
    return buttonCount - 1;
  }

  if (eventKey === 'ArrowRight' || eventKey === 'ArrowDown') {
    return (currentIndex + 1) % buttonCount;
  }

  if (eventKey === 'ArrowLeft' || eventKey === 'ArrowUp') {
    return (currentIndex - 1 + buttonCount) % buttonCount;
  }

  return currentIndex;
}

function handleButtonGroupNavigation(event) {
  const buttons = [...event.currentTarget.querySelectorAll(BUTTON_SELECTOR)];
  const currentIndex = buttons.indexOf(document.activeElement);

  if (buttons.length < 2 || currentIndex < 0) {
    return;
  }

  const nextIndex = getNextButtonIndex(event.key, currentIndex, buttons.length);

  if (nextIndex === currentIndex) {
    return;
  }

  event.preventDefault();
  buttons[nextIndex].focus();
}

export { handleButtonGroupNavigation };
