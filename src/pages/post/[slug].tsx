import { GetStaticPaths, GetStaticProps } from 'next';

import Head from 'next/head'
import Link from 'next/link'

import { useRouter } from 'next/router'

import { getPrismicClient } from '../../services/prismic';

import Prismic from '@prismicio/client';

import Header from '../../components/Header'
import {Comments} from '../../components/Comments'

import { format, parseISO } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR';

import {FiCalendar, FiUser, FiClock} from 'react-icons/fi'


import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  uid: string;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
  nextPost: Post | null;
  prevPost: Post | null;
}

export default function Post({
  post,
  preview,
  prevPost,
  nextPost,

}: PostProps): JSX.Element {
  const router = useRouter();
  
  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const readingTime = post.data.content.reduce((acc, content) => {
    const textBody = RichText.asText(content.body);
    const split = textBody.split(' ')
    const numberWorlds = split.length;

    const result = Math.ceil(numberWorlds / 200)
    return acc + result;
  }, 0)


  return ( 
    <>
      <Head>
        <title>{post.data.title}</title>
      </Head>
      
      <section className={commonStyles.container}>
        <Header/>
      </section>

      <section className={styles.banner}>
           <img src={post.data.banner.url} alt={post.data.title} />
      </section>

      <section className={commonStyles.container}>
        <main className={styles.hero}>
          <div className={styles.title}>
            <h1>{post.data.title}</h1>
            <section className={styles.firstPublicationDate}>
              <time>
                <FiCalendar className={styles.iconCalendar}/>
                {format(
                  parseISO(post.first_publication_date),
                  'dd MMM yyyy',
                  {
                    locale: ptBR,
                  }
                )}
              </time>
              <span className={styles.author}>
                <FiUser className={styles.iconUser}/>
                {post.data.author}
              </span>
              <span className={styles.timer}>
                <FiClock className={styles.iconClock}/>
                {readingTime} min
              </span>
            </section>

            <section className={styles.lastPublicationDate}>
              <time>
                  <span className={styles.lastPublicationDate }>
                    * editado em{' '}
                    {format(
                      parseISO(post.last_publication_date),
                      "dd MMM yyyy', às 'HH:mm",
                      {
                        locale: ptBR,
                      }
                    )}
                  </span>
              </time>
            </section>
          </div>

          <div className={styles.post}>
            {post.data.content.map(post => (
              <section key={post.heading}>
                <h2>{post.heading}</h2>
                <article
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(post.body),
                  }}
                /> 

              </section>
            ))}
              
          </div>

          <div className={styles.line}></div>

          <section className={styles.navigatePosts}>
            <div className={styles.prevPost}>
              {prevPost && (
                <Link href={`/post/${prevPost.uid}`}>
                  <a >
                    {prevPost.data.title}
                    <span>Post anterior</span>
                  </a>
                </Link>
              )}
            </div>

            <div className={styles.nextPost}>
              {nextPost && (
                <Link href={`/post/${nextPost.uid}`}>
                  <a>
                    {nextPost.data.title}
                    <span>Próximo post</span>
                  </a>
                </Link>
              )}
            </div>
          </section>

          <div className={commonStyles.comment} id="comments">
            <Comments />
          </div>

          {preview && (
            <aside className={commonStyles.exitPreview}>
              <Link href="/api/exit-preview">
                <a>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </main>
      </section>

    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts')
  ]);

  const paths = posts.results.map(post => ({
    params: { slug: post.uid},
  }))

  return { paths, fallback: true}
};

export const getStaticProps: GetStaticProps = async ({
   params: {slug},
   preview = false,
   previewData
  }) => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID(
    'posts', 
    String(slug), {
      ref: previewData?.ref ?? null,
    }
  )

  const prevPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
      fetch: ['post.title'],
    })
  ).results[0];

  const nextPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
      fetch: ['posts.title'],
    })
  ).results[0];

  const post = {
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url
      },
      author: response.data.author,
      content: response.data.content,
    }
  }

  return {
    props: {
      post,
      preview,
      prevPost: prevPost ?? null,
      nextPost: nextPost ?? null
    },
    revalidate: 60 * 60, // 1 Hora
  };
};
