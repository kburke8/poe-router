import { Card } from '@/components/ui/Card';

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold text-poe-gold">Guide</h1>
        <p className="mt-1 text-sm text-poe-muted">
          Learn how to plan your Path of Exile campaign runs with PoE Router.
        </p>
      </div>

      {/* Overview */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-poe-text">Overview</h2>
        <Card>
          <p className="text-sm text-poe-text leading-relaxed">
            PoE Router is a campaign planning tool for Path of Exile 1. It helps you
            plan which gems to pick up at each town stop, what gear to look for, and generates
            compact regex patterns you can paste into PoE&apos;s stash search to quickly find what
            you need.
          </p>
          <p className="mt-3 text-sm text-poe-text leading-relaxed">
            This is <span className="text-poe-gold font-medium">not</span> a loot filter tool.
            It&apos;s focused on the leveling route itself &mdash; knowing exactly what to grab from
            quest rewards, what to buy from vendors, and what links to aim for at each stage of
            the campaign.
          </p>
        </Card>
      </section>

      {/* Import from PoB */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-poe-text">Import from Path of Building</h2>
        <Card className="space-y-4">
          <p className="text-sm text-poe-text leading-relaxed">
            If you already have a build planned in <span className="font-medium text-poe-gold">Path of Building</span>,
            you can import it directly instead of setting up gem pickups manually.
          </p>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-poe-gold">How to Import</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-poe-muted">
              <li>Click <span className="text-poe-text">Import from PoB</span> on the Builds page or inside the build editor.</li>
              <li>Paste a <span className="text-poe-text">pobb.in URL</span> (e.g. pobb.in/XXXXX) or a raw PoB export code.</li>
              <li>Review the import summary &mdash; class, ascendancy, gem count, and any warnings.</li>
              <li>Click <span className="text-poe-text">Create Build</span> to finalize the import.</li>
            </ol>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-poe-gold">What Gets Imported</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-poe-muted">
              <li><span className="text-poe-text">Class and ascendancy</span> from the PoB build.</li>
              <li><span className="text-poe-text">Gem pickups</span> placed at the earliest campaign stop where each gem is available for your class. Quest rewards are preferred over vendor purchases.</li>
              <li><span className="text-poe-text">Link groups</span> built from PoB&apos;s skill groups with progressive phases showing how your links evolve through the campaign.</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-poe-gold">Multi-Set Builds</h3>
            <p className="text-sm text-poe-muted leading-relaxed">
              If the PoB build has multiple Skill Sets with level annotations (e.g. &ldquo;Level 12&rdquo;
              or &ldquo;Level 30&rdquo; in the set titles), the importer treats each set as a snapshot of
              your gem setup at that point in the campaign. This creates link group phases that show
              exactly how your links change at each stage.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-poe-gold">After Importing</h3>
            <p className="text-sm text-poe-muted leading-relaxed">
              The imported build is a starting point. You can refine gem sources (quest reward vs.
              vendor), adjust which stops are enabled, add gear goals, and configure mule gems just
              like any manually created build.
            </p>
          </div>
        </Card>
      </section>

      {/* Builds */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-poe-text">Builds</h2>
        <Card className="space-y-4">
          <p className="text-sm text-poe-text leading-relaxed">
            A <span className="font-medium text-poe-gold">Build</span> is your leveling plan. It
            contains a sequence of town stops from Act 1 through Act 10, each with gem pickups,
            gear goals, and skill transitions.
          </p>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-poe-gold">Creating a Build</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-poe-muted">
              <li>Go to the <span className="text-poe-text">Builds</span> page and click <span className="text-poe-text">New Build</span>, or use <span className="text-poe-text">Import from PoB</span> to start from a Path of Building export.</li>
              <li>Pick your class and ascendancy.</li>
              <li>The editor shows every town stop in the campaign. Enable the stops you care about and disable the ones you want to skip.</li>
              <li>At each stop, add gem pickups from quest rewards or vendor purchases.</li>
            </ol>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-poe-gold">Link Groups</h3>
            <p className="text-sm text-poe-muted leading-relaxed">
              Link groups define your socket setups &mdash; which skill gem goes with which
              supports. These are configured at the build level and carry through each stop.
              The build editor shows which links are available at each stage based on the gems
              you&apos;ve picked up so far.
            </p>
            <p className="text-sm text-poe-muted leading-relaxed">
              When multiple link groups exist at a stop, the gem dropdowns automatically filter
              out gems already used in other link groups. Since each physical gem can only be
              socketed in one item at a time, this prevents accidentally assigning the same gem
              to two different setups.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-poe-gold">Gem Inventory &amp; Dropping</h3>
            <p className="text-sm text-poe-muted leading-relaxed">
              Each stop shows an <span className="text-poe-text font-medium">Inventory</span> panel
              alongside the gem pickups. This displays all gems you&apos;ve accumulated up to that point,
              color-coded by attribute (red/green/blue). Gems currently slotted in link groups appear
              dimmed.
            </p>
            <p className="text-sm text-poe-muted leading-relaxed">
              You can <span className="text-poe-text font-medium">drop</span> unwanted gems (e.g., the
              free Dual Strike you get as a Duelist on the beach) by clicking the &times; button on
              any unslotted gem. Dropped gems are removed from your inventory at that stop and all
              subsequent stops. You can undo a drop at any time.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-poe-gold">Mule</h3>
            <p className="text-sm text-poe-muted leading-relaxed">
              If you need gems that aren&apos;t available to your class, you can configure a mule
              character. The mule section lets you pick a secondary class and list the gems to
              transfer over.
            </p>
          </div>
        </Card>
      </section>

      {/* Run View */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-poe-text">Run View</h2>
        <Card className="space-y-4">
          <p className="text-sm text-poe-text leading-relaxed">
            Once your build is planned, open the <span className="font-medium text-poe-gold">Run View</span> for
            a guided playthrough. This is the screen you use during an actual campaign run.
          </p>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-poe-gold">How It Works</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-poe-muted">
              <li>Each enabled stop is shown in sequence with its gem pickups and gear goals.</li>
              <li>Use the <span className="text-poe-text">detail slider</span> to control how much information is shown &mdash; from a minimal checklist to full details.</li>
              <li>Each stop has a <span className="text-poe-text">copy regex</span> button that copies a stash search pattern for that stop&apos;s relevant items.</li>
              <li>Paste the regex into PoE&apos;s stash search to instantly highlight what you need.</li>
            </ul>
          </div>
        </Card>
      </section>

      {/* Regex Builder */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-poe-text">Regex Builder</h2>
        <Card className="space-y-4">
          <p className="text-sm text-poe-text leading-relaxed">
            The Regex Builder generates compact search patterns for PoE&apos;s stash tab search. It
            uses an abbreviation engine that finds the shortest unique pattern for each
            gem or item name &mdash; short enough to fit many entries into one search string, but
            precise enough to avoid false matches.
          </p>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-poe-gold">Categories</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-poe-muted">
              <li><span className="text-poe-text">Gems</span> &mdash; skill and support gems to highlight.</li>
              <li><span className="text-poe-text">Links</span> &mdash; linked socket configurations.</li>
              <li><span className="text-poe-text">Stats</span> &mdash; stat requirements or mod patterns.</li>
              <li><span className="text-poe-text">Items</span> &mdash; specific item bases to look for.</li>
              <li><span className="text-poe-text">Item Gambas</span> &mdash; items to gamble from vendors.</li>
              <li><span className="text-poe-text">Exclusions</span> &mdash; patterns prefixed with <code className="text-poe-gold">!</code> to hide unwanted matches.</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-poe-gold">The 250-Character Limit</h3>
            <p className="text-sm text-poe-muted leading-relaxed">
              PoE&apos;s stash search has a 250-character limit. The regex builder shows a live
              character count so you know when you&apos;re approaching the cap. The abbreviation
              engine keeps patterns as short as possible to maximize how many entries fit.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-poe-gold">Using the Output</h3>
            <p className="text-sm text-poe-muted leading-relaxed">
              Copy the generated regex string and paste it into PoE&apos;s stash tab search bar.
              Matching items will be highlighted. The format is: exclusions first
              (prefixed with <code className="text-poe-gold">!</code>), then inclusions separated
              by <code className="text-poe-gold">|</code> (OR), with spaces acting as AND.
            </p>
          </div>
        </Card>
      </section>

      {/* Import/Export */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-poe-text">Import / Export</h2>
        <Card className="space-y-3">
          <p className="text-sm text-poe-text leading-relaxed">
            All your data (builds, regex presets, and run history) is stored locally in your
            browser using IndexedDB. Nothing is sent to a server.
          </p>
          <p className="text-sm text-poe-muted leading-relaxed">
            <span className="text-poe-text font-medium">Path of Building</span> &mdash; Import a build
            directly from a pobb.in URL or PoB export code. See the &ldquo;Import from Path of Building&rdquo;
            section above for details.
          </p>
          <p className="text-sm text-poe-muted leading-relaxed">
            <span className="text-poe-text font-medium">JSON Export/Import</span> &mdash; To share builds or
            back up all your data, use the <span className="text-poe-text">Export All Data</span> button
            on the Dashboard. This downloads a JSON file you can share with others or import on
            another machine using <span className="text-poe-text">Import from JSON</span>.
          </p>
        </Card>
      </section>

      {/* Tips */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-poe-text">Tips</h2>
        <Card>
          <ul className="list-disc list-inside space-y-2 text-sm text-poe-muted">
            <li>
              <span className="text-poe-text font-medium">Generate Vendor Regex</span> &mdash;
              In the build editor, this button auto-populates a regex preset with all the gems
              from your build plan, saving you from manually adding them one by one.
            </li>
            <li>
              <span className="text-poe-text font-medium">Disable stops you skip</span> &mdash;
              Not every town stop matters for your build. Disable the ones you skip to keep the
              Run View clean and focused.
            </li>
            <li>
              <span className="text-poe-text font-medium">Check gem availability</span> &mdash;
              The gem picker shows which gems are available as quest rewards vs. vendor purchases
              at each stop, and flags gems that require a mule.
            </li>
            <li>
              <span className="text-poe-text font-medium">Use the detail slider</span> &mdash;
              During a run, slide the detail level down for a quick checklist or up for full
              gem and gear information at each stop.
            </li>
          </ul>
        </Card>
      </section>
    </div>
  );
}
