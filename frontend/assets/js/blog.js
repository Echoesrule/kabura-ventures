        let currentPage = 1;
        let currentCategory = '';
        let currentSearch = '';
        let totalPages = 1;

        async function loadCategories() {
            try {
                const result = await api.getBlogCategories();
                const container = document.getElementById('category-filter');
                (result.categories || []).forEach(cat => {
                    const btn = document.createElement('button');
                    btn.textContent = cat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    btn.dataset.category = cat;
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('#category-filter button').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        currentCategory = cat;
                        currentPage = 1;
                        loadBlogs(true);
                    });
                    container.appendChild(btn);
                });
            } catch {}
        }

        async function loadBlogs(reset = false) {
            const container = document.getElementById('blog-list');
            if (reset) {
                container.innerHTML = '<div class="skeleton-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:1.25rem;">' + Array(4).fill('<div class="skeleton-card"><div class="skeleton-img" style="height:200px;"></div><div class="skeleton-body"><div class="skeleton-line w-40"></div><div class="skeleton-line w-80"></div><div class="skeleton-line w-60"></div><div class="skeleton-line w-50"></div></div></div>').join('') + '</div>';
                currentPage = 1;
            }

            try {
                const params = { page: currentPage, per_page: 12 };
                if (currentCategory) params.category = currentCategory;
                if (currentSearch) params.search = currentSearch;

                const result = await api.getBlogs(params);
                totalPages = result.pages;

                if (reset) container.innerHTML = '';

                if (result.blogs.length === 0) {
                    container.innerHTML = '<div class="empty-state"><h3>No posts found</h3><p>Check back soon for new content.</p></div>';
                    document.getElementById('load-more').style.display = 'none';
                    return;
                }

                result.blogs.forEach(blog => {
                    const card = document.createElement('div');
                    card.className = 'blog-card card';
                    const img = blog.image_url || '/assets/images/placeholder.svg';
                    const tags = Array.isArray(blog.tags) ? blog.tags.join(', ') : '';
                    card.innerHTML = `
                        <a href="/blog-detail?slug=${blog.slug}" style="text-decoration:none;color:inherit;">
                            <img src="${escapeHTML(img)}" alt="${escapeHTML(blog.title)}" loading="lazy" onerror="this.src='/assets/images/placeholder.svg'">
                            <div class="blog-card-body">
                                <span class="blog-card-category">${escapeHTML(blog.category || 'Guide')}</span>
                                <h3>${escapeHTML(blog.title)}</h3>
                                <p>${escapeHTML(blog.excerpt || '')}</p>
                                <div class="blog-card-footer">
                                    <span>${escapeHTML(blog.author || 'Kabura Ventures')}</span>
                                    <span>${escapeHTML(blog.published_at ? new Date(blog.published_at).toLocaleDateString() : '')}</span>
                                </div>
                            </div>
                        </a>
                    `;
                    container.appendChild(card);
                });

                document.getElementById('load-more').style.display = currentPage < totalPages ? 'inline-flex' : 'none';
            } catch (err) {
                if (reset) container.innerHTML = '<div class="empty-state"><h3>Could not load blogs</h3></div>';
            }
        }

        document.getElementById('blog-search')?.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            currentPage = 1;
            loadBlogs(true);
        });

        document.getElementById('load-more')?.addEventListener('click', () => {
            currentPage++;
            loadBlogs();
        });

        loadCategories();
        loadBlogs(true);