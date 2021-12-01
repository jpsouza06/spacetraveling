import { useState } from 'react';

import { GetStaticProps } from 'next';

import Head from 'next/head'
import Link from 'next/link'

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';

import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR';

import {FiCalendar, FiUser} from 'react-icons/fi'

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';



interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
  preview: boolean;
}

interface HomeProps {
  postsPagination: PostPagination;
}


export default function Home(
  {postsPagination: {next_page, results, preview}
}: HomeProps) {
  const [posts, setPosts] = useState(results);
  const [nextPage, setNextPage] = useState(next_page);



  async function handleGetNextPage(): Promise<void> {
    const response = await (await fetch(nextPage)).json();
    setPosts([...posts, ...response.results]);
    setNextPage(response.next_page);
  }

  return (
    <>
      <Head>
        <title>Space Traveling</title>
      </Head>

      <main className={commonStyles.container}>
        <div className={styles.logo}>
          <a href="/">
            <img src="/images/Logo.svg" alt="logo" />
          </a>
        </div>

        <div className={styles.posts}>
            { posts.map(post => (
              <Link key={post.uid} href={`/post/${post.uid}`}>
                <a key={post.uid}>
                <h1>{post.data.title}</h1>
                <h2>{post.data.subtitle}</h2>
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
                  <span>
                    <FiUser className={styles.iconUser}/>
                    {post.data.author}
                  </span>
                </section>
              </a>
              </Link>
            ))}
         </div>

        {nextPage && (
             <button className={styles.button} onClick={handleGetNextPage}>Carregar mais posts</button>
        )}

        {preview && (
          <aside className={commonStyles.exitPreview}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData
}) => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 1,
    ref: previewData?.ref ?? null,
  });

  const posts = postsResponse.results.map(post => {

    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }, 
    }
  })

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page,
        preview
      }
    },
    revalidate: 60 * 60,
  }
};
