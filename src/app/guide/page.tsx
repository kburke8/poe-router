import { Card } from '@/components/ui/Card';

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold text-poe-gold">Guide</h1>
        <p className="mt-1 text-sm text-poe-muted">
          Learn how to plan your Path of Exile campaign speed runs with PoE Router.
        </p>
      </div>

      {/* Overview */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-poe-text">Overview</h2>
        <Card>
          <p className="text-sm text-poe-text leading-relaxed">
            PoE Router is a campaign planning tool for Path of Exile 1 speed runs. It helps you
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
              <li>Go to the <span className="text-poe-text">Builds</span> page and click <span className="text-poe-text">New Build</span>.</li>
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
            a guided playthrough. This is the screen you use during an actual speed run.
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
        <Card>
          <p className="text-sm text-poe-text leading-relaxed">
            All your data (builds, regex presets, and run history) is stored locally in your
            browser using IndexedDB. Nothing is sent to a server.
          </p>
          <p className="mt-3 text-sm text-poe-muted leading-relaxed">
            To share a build or back up your data, use the <span className="text-poe-text">Export All Data</span> button
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
