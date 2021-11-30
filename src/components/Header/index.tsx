import Link from 'next/link'

import styles from './header.module.scss'
import commonStyles from '../../styles/common.module.scss';


export default function Header() {
  return (
    <header className={commonStyles.container}>
      <div className={styles.logo}>       
      <Link href="/">
          <a>
            <img src="/images/Logo.svg" alt="logo" />
          </a>
        </Link>
      </div>
    </header>
  );
}
