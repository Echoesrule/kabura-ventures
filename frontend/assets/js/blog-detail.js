        (async function() {
            const params = new URLSearchParams(window.location.search);
            const slug = params.get('slug');
            const container = document.getElementById('blog-article');

            if (!slug) {
                container.innerHTML = '<div class="empty-state"><h3>No blog post specified</h3></div>';
                return;
            }

            try {
                const result = await api.getBlog(slug);
                const blog = result.blog;
                const tags = Array.isArray(blog.tags) ? blog.tags : [];

                container.innerHTML = `
                    ${blog.image_url ? `<img src="${escapeHTML(blog.image_url)}" alt="${escapeHTML(blog.title)}" class="featured" onerror="this.style.display='none'">` : ''}
                    <h1>${escapeHTML(blog.title)}</h1>
                    <div class="meta">
                        <span>By ${escapeHTML(blog.author || 'Kabura Ventures')}</span>
                        <span>${escapeHTML(blog.published_at ? new Date(blog.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '')}</span>
                        <span class="tag">${escapeHTML(blog.category || 'Guide')}</span>
                        ${tags.map(t => `<span class="tag">${escapeHTML(t.trim())}</span>`).join('')}
                    </div>
                    <div class="content">${escapeHTML(blog.content)}</div>
                    <div class="blog-nav">
                        <a href="/blog.html" class="btn btn-secondary">&larr; Back to Blog</a>
                    </div>
                `;
            } catch (err) {
                container.innerHTML = '<div class="empty-state"><h3>Blog post not found</h3></div>';
            }
        })();