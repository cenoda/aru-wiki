// Official trailers and PVs for a wiki page, from the official Korean Genshin Impact YouTube
// channel (scripts/youtube/). Shown as a still from YouTube's own thumbnail server with a play
// button; the YouTube player (privacy-enhanced youtube-nocookie.com) loads only on a click, so
// opening a page plays nothing. Nothing is copied to our server. Videos of a later version than
// the one chosen are not shown.
import { useEffect, useState } from 'react';
import { loadVideos, type PageVideo } from './lore';

export function useVideos(page: string, vIdx: number) {
  const [all, setAll] = useState<Record<string, PageVideo[]> | null>(null);
  useEffect(() => { let live = true; loadVideos().then((v) => live && setAll(v)); return () => { live = false; }; }, []);
  return (all?.[page] ?? []).filter((x) => x.v <= vIdx);
}

export function Video({ v, title }: { v: PageVideo; title: string }) {
  title = v.t ?? title;
  const [play, setPlay] = useState(false);
  if (play) {
    return (
      <div className="wv-frame">
        <iframe src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`} title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      </div>
    );
  }
  return (
    <button type="button" className="wv-frame wv-still" onClick={() => setPlay(true)} aria-label={`${title} 재생 (YouTube)`}>
      <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt="" loading="lazy" referrerPolicy="no-referrer" />
      <span className="wv-play" aria-hidden="true" />
    </button>
  );
}

const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/** The rest of the page's videos, in a section near the end of the article. */
export function VideoSection({ list, name }: { list: PageVideo[]; name: string }) {
  if (!list.length) return null;
  return (
    <section id="videos">
      <h2>공식 영상</h2>
      <p className="wa-muted wa-small">원신 공식 YouTube 채널(한국)의 영상 중 이 항목을 다룬 것입니다. 누르면 YouTube 플레이어가 열립니다. 영상과 미리보기 그림은 YouTube에서 바로 불러오며, 권리는 HoYoverse에 있습니다.</p>
      <ul className="wv-grid">
        {list.map((v) => (
          <li key={v.id}>
            <Video v={v} title={`${name} 공식 영상`} />
            <a className="wa-small" href={watchUrl(v.id)} target="_blank" rel="noreferrer">{v.t ?? 'YouTube에서 보기'}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
