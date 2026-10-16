import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { Feed } from "@/components/landing/Feed";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const cta = user ? { href: "/dashboard", label: "Open your shortlist" } : { href: "/login", label: "Start your free trial" };

  return (
    <div className="wrap landing">
      <header className="top">
        <BrandMark />
        <nav aria-label="Main">
          <a className="hide-small" href="#how">How it works</a>
          <a className="hide-small" href="#pricing">Pricing</a>
          {user ? (
            <Link href="/dashboard">Dashboard</Link>
          ) : (
            <Link href="/login">Sign in</Link>
          )}
        </nav>
      </header>

      <main>
        <div className="hero">
          <div>
            <h1>Find the public contracts your business could actually win</h1>
            <p className="lede">
              BidRadar reads every new UK public tender each morning, checks it against what your business does, and
              sends you a short list worth bidding on. Each one comes with a plain-English summary and a first draft to
              start from.
            </p>
            <Link className="btn" href={cta.href}>
              {cta.label}
            </Link>
            <p className="note">14 days free. No card needed.</p>
          </div>
          <Feed />
        </div>

        <section>
          <p className="statement">
            Thousands of public contract notices are published every week. Most small businesses don&apos;t have time
            to read them, so they hear about the right one after it has closed.
          </p>
          <p>BidRadar does the reading for you.</p>
        </section>

        <section id="how">
          <h2>How it works</h2>
          <ol className="steps">
            <li>
              <h3>Tell us what you do</h3>
              <p>Describe your services, the regions you work in, and the contract sizes you can take on. It takes about five minutes.</p>
            </li>
            <li>
              <h3>The agent checks every new notice</h3>
              <p>Each morning it reads new tenders from the UK government&apos;s official Find a Tender service, drops the ones that don&apos;t fit, and scores the rest against your profile.</p>
            </li>
            <li>
              <h3>You get a short list</h3>
              <p>An email and a dashboard with the tenders worth your time: why each one fits, what the buyer wants, the key dates, and a first-draft response.</p>
            </li>
          </ol>
          <p className="control">
            You stay in control. BidRadar never submits anything on your behalf. You review, edit, and send every bid yourself.
          </p>
        </section>

        <section>
          <div className="split">
            <h2>Made for teams without a bid department</h2>
            <div>
              <p>If you win work through public tenders but nobody on your team has time to search for them, BidRadar is for you.</p>
              <p>
                It suits digital and IT agencies, consultancies, training providers, construction and facilities firms,
                cleaning and security companies, and any small business that sells to councils, schools, universities,
                the NHS, or government departments.
              </p>
            </div>
          </div>
        </section>

        <section id="pricing">
          <div className="plan">
            <div>
              <h2>One plan, everything included</h2>
              <p className="price">
                £49<small>a month</small>
              </p>
              <p className="note">Try it free for 14 days. Cancel any time.</p>
            </div>
            <div>
              <ul className="includes">
                <li>A daily shortlist of tenders that fit your business</li>
                <li>A fit score with reasons and risks for every tender</li>
                <li>Plain-English summaries and requirement checklists</li>
                <li>First-draft responses for your strongest matches</li>
                <li>Every new UK public tender, checked every weekday</li>
              </ul>
              <Link className="btn" href={cta.href}>
                {cta.label}
              </Link>
            </div>
          </div>
        </section>

        <section>
          <h2>Questions</h2>
          <div className="faq">
            <details>
              <summary>Which countries do you cover?</summary>
              <p>UK public tenders from the government&apos;s official Find a Tender service. EU tenders are next on our roadmap.</p>
            </details>
            <details>
              <summary>Does BidRadar submit bids for me?</summary>
              <p>No. It finds and summarises opportunities and writes a starting draft. You review, edit, and submit everything yourself.</p>
            </details>
            <details>
              <summary>How good are the first drafts?</summary>
              <p>
                They&apos;re built from the tender notice and your business profile, and checked by a second AI reviewer
                against the buyer&apos;s requirements. Anything only you can confirm is marked for you to fill in. Always
                check and adapt a draft before submitting.
              </p>
            </details>
            <details>
              <summary>What happens to my business information?</summary>
              <p>We use your profile only to find, score, and draft tenders for you. We don&apos;t sell or share it.</p>
            </details>
            <details>
              <summary>What happens after the free trial?</summary>
              <p>Your shortlist pauses until you subscribe. Nothing is charged automatically, because we never ask for a card during the trial.</p>
            </details>
          </div>
        </section>
      </main>

      <footer className="site-foot">
        <span>© 2026 BidRadar</span>
        <span>Tender data from Find a Tender, under the Open Government Licence v3.0.</span>
      </footer>
    </div>
  );
}
