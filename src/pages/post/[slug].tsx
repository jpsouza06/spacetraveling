import { GetStaticPaths, GetStaticProps } from 'next';

import Head from 'next/head'
import { useRouter } from 'next/router'

import { getPrismicClient } from '../../services/prismic';

import Prismic from '@prismicio/client';

import Header from '../../components/Header'

import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR';

import {FiCalendar, FiUser, FiClock} from 'react-icons/fi'


import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';

interface Post {
  first_publication_date: string | null;
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
}

export default function Post({post}: PostProps) {
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
            <section>
              <time>
                <FiCalendar className={styles.iconCalendar}/>
                {format(
                  new Date(post.first_publication_date),
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

  const post = {
    first_publication_date: response.first_publication_date,
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
      preview
    }
  };
};
