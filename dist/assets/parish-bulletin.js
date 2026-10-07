import { AnnouncementPhotos, FeedPostHeader } from './announcement-reports.js?v=20261008-social-feed';
const categories = ['Project transparency', 'Donations & contributions', 'Visiting priests', 'Fundraising', 'Parish matters'];

export function ParishBulletin({ React, readPosts, accessToken }) {
  const h = React.createElement;
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [category, setCategory] = React.useState('All updates');
  const [revision, refresh] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    (async () => {
      try {
        if (!accessToken) throw new Error('Please sign in again to load parish posts.');
        const rows = await readPosts('parish_bulletins', 'select=*,parishes(parish_name)&status=eq.Published&order=published_at.desc&limit=100', accessToken);
        if (active) setPosts(Array.isArray(rows) ? rows : []);
      } catch (cause) {
        if (active) setError('Parish updates could not be loaded. ' + (cause.message || 'Please try again.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [readPosts, accessToken, revision]);

  const items = posts.filter(post => category === 'All updates' || post.category === category);
  return h('section', { className: 'parish-bulletin', 'aria-label': 'Parish Bulletin' },
    h('div', { className: 'user-panel__header' }, h('h4', null, 'Parish Bulletins'),
      h('button', { type: 'button', disabled: loading, onClick: () => refresh(value => value + 1) }, 'Refresh')),
    error && h('p', { className: 'bulletin-notice', role: 'alert' }, error),
    h('label', { className: 'login-field bulletin-filter' }, h('span', null, 'Category'),
      h('select', { value: category, onChange: event => setCategory(event.target.value) }, ['All updates', ...categories].map(value => h('option', { key: value, value }, value)))),
    loading ? h('p', { role: 'status' }, 'Loading posts from your parish…') :
      h('div', { className: 'bulletin-grid' }, items.map(post => h('article', { key: post.id, className: 'bulletin-post' },
        h(FeedPostHeader, { React, name: post.parishes?.parish_name || 'Parish Office', date: post.published_at, category: post.category }),
        h('h4', null, post.title),
        h('p', { className: 'bulletin-content' }, post.content),
        h(AnnouncementPhotos, { React, row: post }))),
        !items.length && !error && h('p', null, 'No published bulletins in this category.')));
}
