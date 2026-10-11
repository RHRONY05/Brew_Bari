-- supabase/tests/07_feedback.sql
-- Asserts:
-- - rating 0 or 6 raises BAD_RATING
-- - first submit inserts feedback
-- - second submit updates instead of inserting (upsert on session_id)

begin;

-- Arrange test data
insert into public.restaurants (id, slug, name_en, package)
values ('10000000-0000-0000-0000-000000000001', 'test-feedback-cafe', 'Test Feedback Cafe', 3);

insert into public.tables (id, restaurant_id, number, qr_token)
values ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, 'token_feedback_test');

insert into public.table_sessions (id, restaurant_id, table_id, status)
values ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'open');

set local role anon;

do $$
declare
  v_res jsonb;
begin
  -- Rating 0 should fail
  begin
    perform public.submit_feedback('token_feedback_test', 0, 'Invalid rating');
    raise exception 'FAIL: rating 0 should raise BAD_RATING';
  exception when others then
    if sqlerrm <> 'BAD_RATING' then
      raise exception 'FAIL: expected BAD_RATING, got %', sqlerrm;
    end if;
  end;

  -- Rating 6 should fail
  begin
    perform public.submit_feedback('token_feedback_test', 6, 'Invalid rating');
    raise exception 'FAIL: rating 6 should raise BAD_RATING';
  exception when others then
    if sqlerrm <> 'BAD_RATING' then
      raise exception 'FAIL: expected BAD_RATING, got %', sqlerrm;
    end if;
  end;

  -- First submission: rating 5
  v_res := public.submit_feedback('token_feedback_test', 5, 'Great coffee!');
  if (v_res->>'ok')::boolean <> true then
    raise exception 'FAIL: first submit should return ok:true';
  end if;

  -- Second submission: rating 4 (should update, not error or duplicate)
  v_res := public.submit_feedback('token_feedback_test', 4, 'Updated: Good coffee');
  if (v_res->>'ok')::boolean <> true then
    raise exception 'FAIL: second submit should return ok:true';
  end if;
end $$;

-- Switch to owner/postgres role to verify database row count and updated values
reset role;

do $$
declare
  v_cnt int;
  v_rating int;
  v_comment text;
begin
  select count(*), max(rating), max(comment) into v_cnt, v_rating, v_comment
  from public.feedback where session_id = '60000000-0000-0000-0000-000000000001';

  if v_cnt <> 1 then
    raise exception 'FAIL: expected exactly 1 feedback row, found %', v_cnt;
  end if;

  if v_rating <> 4 then
    raise exception 'FAIL: expected updated rating 4, got %', v_rating;
  end if;

  if v_comment <> 'Updated: Good coffee' then
    raise exception 'FAIL: expected updated comment, got %', v_comment;
  end if;
end $$;

rollback;
