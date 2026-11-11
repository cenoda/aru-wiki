import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categoryLinks, pageCategories, releaseVersionList, templateCalls, topLevelText, unconditionalCategories } from './dump-categories.mjs';
import { Expander, evalExpr, parseWikitext } from './expand.mjs';

test('Change History version list and quest rules', () => {
  const versions = releaseVersionList('{{#switch:{{{introduced|}}}|1.0=x}}{{#switch:{{{1|}}}<!--\n-->|1.0|Luna I<!--\n-->|7.1=[[Category:Released in Version {{{1|}}}]]}}');
  assert.deepEqual([...versions], ['1.0', 'Luna I', '7.1']);
  const page = '{{Quest Infobox|type=World|event_name=Lantern Rite|region=Liyue}}{{Change History|Luna I}}<!-- [[Category:Hidden]] -->[[Category:Lore| ]]';
  const { categories, sortkey } = pageCategories(page, 'Some Quest', { releaseVersions: versions });
  assert.deepEqual(categories.sort(), ['Event Quests', 'Lantern Rite Quests', 'Liyue Quests', 'Lore', 'Quests', 'Released in Version Luna I', 'Version', 'World Quests']);
  assert.equal(sortkey('Lore'), ' \nSOME QUEST');
  assert.equal(sortkey('Quests'), 'SOME QUEST');
  assert.deepEqual(pageCategories('{{Change History|9.9}}', 'X', { releaseVersions: versions }).categories, ['Released in Unknown Version', 'Version']);
  assert.deepEqual(pageCategories('{{Act Infobox}}', 'X').categories, ['Quest Acts', 'Act']);
  assert.deepEqual(pageCategories('{{Vendor|Chef Mao}}', 'Wanmin Restaurant').categories, ['Shops']);
  assert.deepEqual(pageCategories('{{Shop\n|item1=Fish}}', 'Chef Mao').categories, ['Shops']);
  assert.deepEqual(pageCategories('{{Shopping}}', 'X').categories, []);
});

test('brace matching and unconditional template categories', () => {
  assert.equal(topLevelText('a{{#if:{{{x|{{{y}}}}}}|b}}c{{{z}}}d'), 'acd');
  assert.deepEqual(unconditionalCategories('<includeonly>[[Category:Always]]{{#if:{{{a|}}}|[[Category:Sometimes]]}}</includeonly><noinclude>[[Category:Templates]]</noinclude>'), ['Always']);
  assert.deepEqual(categoryLinks('[[Category:A|k]] [[:Category:Link]] [[category:b_c]]'), ['A', 'b c']);
  assert.deepEqual(templateCalls('{{Foo|x={{Bar}}}}{{PAGENAME}}').map((c) => c.name).sort(), ['Bar', 'Foo']);
});

test('expander: parameters, parser functions and Namespace detect', () => {
  const pages = {
    'Template:Box': { content: '<includeonly>{{Namespace|main={{#switch:{{{type|}}}|NPC|Mentioned=[[Category:NPCs]]|#default=[[Category:Characters]]}}[[Category:Q{{#expr:5 - {{{q|1}}}}}]]}}</includeonly><noinclude>[[Category:Templates]]</noinclude>' },
    'Template:Namespace': { content: '{{SAFESUBST:<noinclude />#invoke:Namespace detect}}' },
    'Template:Alias': { content: '#REDIRECT [[Template:Box]]', redirect: 'Template:Box' },
  };
  const ex = new Expander({ getPage: (t) => pages[t], canonicalTitle: (t) => t.replace(/_/g, ' ') });
  const cats = (text, title = 'Page') => categoryLinks(ex.expandPage(title, text).text);
  assert.deepEqual(cats('{{Alias|type=NPC|q=4}}'), ['NPCs', 'Q1']);
  assert.deepEqual(cats('{{Box}}'), ['Characters', 'Q4']);
  assert.deepEqual(cats('{{Box}}', 'Template:Doc'), [], 'Namespace|main= applies to articles only');
  assert.deepEqual(cats('{{#if: |[[Category:A]]|[[Category:B]]}}{{#ifeq: 01 | 1 |[[Category:C]]}}{{lc:X}}'), ['B', 'C']);
  assert.deepEqual(parseWikitext('a{{b|[[c|d]]}}')[1].parts.length, 2, 'pipes inside links do not split arguments');
  assert.equal(evalExpr('2 * (3 + 1)'), 8);
  assert.equal(evalExpr('-3 + 1'), -2);
  assert.equal(evalExpr('1 +'), null);
});
