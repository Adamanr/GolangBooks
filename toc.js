// Populate the sidebar
//
// This is a script, and not included directly in the page, to control the total size of the book.
// The TOC contains an entry for each page, so if each page includes a copy of the TOC,
// the total size of the page becomes O(n**2).
class MDBookSidebarScrollbox extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = '<ol class="chapter"><li class="chapter-item expanded "><a href="intro.html"><strong aria-hidden="true">1.</strong> О курсе</a></li><li class="chapter-item expanded "><a href="chapter_1/chapter_1.html"><strong aria-hidden="true">2.</strong> Основы Go</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="chapter_1/chapter_2.html"><strong aria-hidden="true">2.1.</strong> Первое знакомство с Go</a></li><li class="chapter-item expanded "><a href="chapter_1/chapter_3.html"><strong aria-hidden="true">2.2.</strong> Работа с переменными</a></li><li class="chapter-item expanded "><a href="chapter_1/chapter_4.html"><strong aria-hidden="true">2.3.</strong> Основные конструкции управления в Go</a></li><li class="chapter-item expanded "><a href="chapter_1/chapter_5.html"><strong aria-hidden="true">2.4.</strong> Slice, map и их особенности</a></li><li class="chapter-item expanded "><a href="chapter_1/chapter_6.html"><strong aria-hidden="true">2.5.</strong> Горутины</a></li><li class="chapter-item expanded "><a href="chapter_1/chapter_7.html"><strong aria-hidden="true">2.6.</strong> Методы синхронизации между горутинами</a></li><li class="chapter-item expanded "><a href="chapter_1/chapter_8.html"><strong aria-hidden="true">2.7.</strong> Структуры</a></li><li class="chapter-item expanded "><a href="chapter_1/chapter_9.html"><strong aria-hidden="true">2.8.</strong> Интерфейсы</a></li><li class="chapter-item expanded "><a href="chapter_1/chapter_10.html"><strong aria-hidden="true">2.9.</strong> Работа с паникой и defer</a></li><li class="chapter-item expanded "><a href="chapter_1/chapter_11.html"><strong aria-hidden="true">2.10.</strong> Работа с файловой системой</a></li><li class="chapter-item expanded "><a href="chapter_1/chapter_12.html"><strong aria-hidden="true">2.11.</strong> Дженерики в Go</a></li><li class="chapter-item expanded "><a href="chapter_1/chapter_13.html"><strong aria-hidden="true">2.12.</strong> Работа с ошибками</a></li></ol></li><li class="chapter-item expanded "><a href="chapter_2/chapter_0.html"><strong aria-hidden="true">3.</strong> Погружение в глубину</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="chapter_2/chapter_1.html"><strong aria-hidden="true">3.1.</strong> Рефлексия</a></li><li class="chapter-item expanded "><a href="chapter_2/chapter_2.html"><strong aria-hidden="true">3.2.</strong> Slice, map глубже</a></li><li class="chapter-item expanded "><a href="chapter_2/chapter_3.html"><strong aria-hidden="true">3.3.</strong> Scheduler и уникальность горутин в Go</a></li><li class="chapter-item expanded "><a href="chapter_2/chapter_4.html"><strong aria-hidden="true">3.4.</strong> Небезопасный Go</a></li><li class="chapter-item expanded "><a href="chapter_2/chapter_5.html"><strong aria-hidden="true">3.5.</strong> Системное программирование в Go и сигналы</a></li><li class="chapter-item expanded "><a href="chapter_2/chapter_6.html"><strong aria-hidden="true">3.6.</strong> GC и методы работы с ним</a></li><li class="chapter-item expanded "><a href="chapter_2/chapter_7.html"><strong aria-hidden="true">3.7.</strong> </a></li></ol></li><li class="chapter-item expanded "><a href="chapter_3/chapter_3.html"><strong aria-hidden="true">4.</strong> Библиотеки Go</a></li></ol>';
        // Set the current, active page, and reveal it if it's hidden
        let current_page = document.location.href.toString().split("#")[0];
        if (current_page.endsWith("/")) {
            current_page += "index.html";
        }
        var links = Array.prototype.slice.call(this.querySelectorAll("a"));
        var l = links.length;
        for (var i = 0; i < l; ++i) {
            var link = links[i];
            var href = link.getAttribute("href");
            if (href && !href.startsWith("#") && !/^(?:[a-z+]+:)?\/\//.test(href)) {
                link.href = path_to_root + href;
            }
            // The "index" page is supposed to alias the first chapter in the book.
            if (link.href === current_page || (i === 0 && path_to_root === "" && current_page.endsWith("/index.html"))) {
                link.classList.add("active");
                var parent = link.parentElement;
                if (parent && parent.classList.contains("chapter-item")) {
                    parent.classList.add("expanded");
                }
                while (parent) {
                    if (parent.tagName === "LI" && parent.previousElementSibling) {
                        if (parent.previousElementSibling.classList.contains("chapter-item")) {
                            parent.previousElementSibling.classList.add("expanded");
                        }
                    }
                    parent = parent.parentElement;
                }
            }
        }
        // Track and set sidebar scroll position
        this.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                sessionStorage.setItem('sidebar-scroll', this.scrollTop);
            }
        }, { passive: true });
        var sidebarScrollTop = sessionStorage.getItem('sidebar-scroll');
        sessionStorage.removeItem('sidebar-scroll');
        if (sidebarScrollTop) {
            // preserve sidebar scroll position when navigating via links within sidebar
            this.scrollTop = sidebarScrollTop;
        } else {
            // scroll sidebar to current active section when navigating via "next/previous chapter" buttons
            var activeSection = document.querySelector('#sidebar .active');
            if (activeSection) {
                activeSection.scrollIntoView({ block: 'center' });
            }
        }
        // Toggle buttons
        var sidebarAnchorToggles = document.querySelectorAll('#sidebar a.toggle');
        function toggleSection(ev) {
            ev.currentTarget.parentElement.classList.toggle('expanded');
        }
        Array.from(sidebarAnchorToggles).forEach(function (el) {
            el.addEventListener('click', toggleSection);
        });
    }
}
window.customElements.define("mdbook-sidebar-scrollbox", MDBookSidebarScrollbox);
