import './style.css';

void import('./main').catch((error) => {
  console.error('Could not start the 3D story:', error);
  document.documentElement.dataset.storyUnavailable = '';
}).finally(() => {
  delete document.documentElement.dataset.starting;
});
